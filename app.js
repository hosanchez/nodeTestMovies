const express = require('express') 
const crypto = require('node:crypto')
const movies = require('./movies.json')
const { error } = require('node:console')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors({
    origin:(origin, callback) =>{
        const ACCEPTED_ORIGINS = [
            'http://localhost:8080',
            'http://localhost:123',
            'http://movies.com',
            'http://midu.dev',
            'https://nodetestmovies-production.up.railway.app',
            'https://nodetestmovies-production.up.railway.app:8080'
        ]
        
        if (ACCEPTED_ORIGINS.includes(origin)) {
            return callback(null, true)
        }

        if (!origin) {
            return callback(null,true)
        }

        return callback(new Error('Not allowed by cors'))
    }
}))

//comentario
// app.use(cors())
app.disable('x-powered-by')// deshabilitar el header x-Powered-By: Express

// Todos los recursos que sean MOVIES se identifica con /movies
app.get('/movies', (req, res) => {
    const { genre } = req.query;

    if (genre) {
        const filteredMovies = movies.filter(
         movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        )
        return res.json(filteredMovies);
    }

    res.json(movies)
})

app.delete('/movies/:id', (req, res) => {
    const {id} = req.params
    const movieIndex = movies.findIndex(movie => movie.id == id)
    if (movieIndex === -1) return res.status(404).json({message: 'Movie not found'})
    movies.splice(movieIndex,1)
    return res.json({message: 'Movie deleted'})
})

app.get('/movies/:id', (req, res) => {
    const { id } = req.params;
    const movie = movies.find(movie => movie.id === id);
    if (movie) return res.json(movie);
    res.status(404).json({ message: 'Movie not found'});
})

app.post('/movies', (req, res) => {

    const result = validateMovie(req.body)

    if (!result.success) {
        // 422 Unproccesable Entity
        return res.status(400).json({ 
            error: JSON.parse(result.error.message)
        })
    }

    // En base de datos
    const newMovie = {
        id: crypto.randomUUID(), // uuid v4
        ...result.data
    }

    // Esto no seria REST , porque estamos guardando el estado
    // de la apliccion en memoria
    movies.push(newMovie)
    res.status(201).json(newMovie) // actualizar 
})

app.patch('/movies/:id', (req, res) =>{
    const result = validatePartialMovie(req.body)

    if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message)})
    }

    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not found'})
    }

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updateMovie
    return res.json(updateMovie)
})

const PORT   = process.env.PORT ?? 1234

app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
})