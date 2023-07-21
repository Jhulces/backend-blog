const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
})


describe('GET tests', () => {
    test('blogs are returned as json', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })
    
    test('all blogs are returned', async () => {
        const blogsAtStart = await helper.blogsInDb()
    
        expect(blogsAtStart).toHaveLength(helper.initialBlogs.length)
    })
    
    test('unique identifier property of the blog posts is named id', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const sampleBlog = blogsAtStart[0]
    
        expect(sampleBlog.id).toBeDefined()
    })
})

describe('POST tests', () => {
    test('a valid blog post can be added', async () => {
        const newBlog = {
            title: "Testing supertest",
            author: "Jhul Ochoa",
            url: "https://JCOE-tests-supertest.com/",
            likes: 8
        }
    
        response = await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)
        
        const blogsAtEnd = await helper.blogsInDb()
    
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
        expect(response.body).toMatchObject(newBlog)
    })
    
    test('if the likes property is missing from the request, it will default to 0', async () => {
        const newBlog = {
            title: "Testing supertest",
            author: "Jhul Ochoa",
            url: "https://JCOE-tests-supertest.com/",
        }
    
        const response = await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(201)
        
        expect(response.body.likes).toBe(0)
    })
    
    test('verify that if title or url are missing from the request, it will be treated as a bad request', async () => {
        const newBlog1 = {
            author: "Jhul Ochoa",
            url: "https://JCOE-tests-supertest.com/"
        }
        await api
            .post('/api/blogs')
            .send(newBlog1)
            .expect(400)
    
        const newBlog2 = {
            title: "Testing supertest",
            author: "Jhul Ochoa"
        }
        await api
            .post('/api/blogs')
            .send(newBlog2)
            .expect(400)
    })
})

describe('DELETE tests', () => {
    test('succeeds with status code 204 if id is valid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]
    
        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(204)
    
        const blogsAtEnd = await helper.blogsInDb()
    
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)
        expect(blogsAtEnd).not.toContainEqual(blogToDelete)

    })
})

describe('PUT tests', () => {
    test('succeeds with status code 200 if id is valid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const newLikes = 69
        const blogToUpdate = blogsAtStart[0]
    
        const response = await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send({likes: newLikes})
            .expect(200)
    
        expect(response.body.likes).toBe(newLikes)

    })
})

afterAll(async () => {
    await mongoose.connection.close()
})