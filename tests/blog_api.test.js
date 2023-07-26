const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

beforeEach(async () => {
    
    await User.deleteMany({})
  
    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })
  
    response = await user.save()

    const signedBlogs = helper.initialBlogs.map(blog => ({...blog, user: response.id}))

    await Blog.deleteMany({})
    await Blog.insertMany(signedBlogs)

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
    test('a valid blog post can be added using root user', async () => {

        const newLogin = {
            username: 'root',
            password: 'sekret'
        }

        const loginData = await api
            .post('/api/login')
            .send(newLogin)
        
        const token = loginData.body.token

        const newBlog = {
            title: "Testing supertest",
            author: "Jhul Ochoa",
            url: "https://JCOE-tests-supertest.com/",
            likes: 8
        }
    
        response = await api
            .post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(201)
            .expect('Content-Type', /application\/json/)
        
        const blogsAtEnd = await helper.blogsInDb()
    
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
        expect(response.body).toMatchObject(newBlog)
    })
    
    test('a blog post cannot be added without an user token', async () =>{

        const blogsAtStart = await helper.blogsInDb()
        const token = null

        const newBlog = {
            title: "Testing supertest",
            author: "Jhul Ochoa",
            url: "https://JCOE-tests-supertest.com/",
            likes: 8
        }
        response = await api
            .post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(401)
            .expect('Content-Type', /application\/json/)
        
        const blogsAtEnd = await helper.blogsInDb()
    
        expect(blogsAtEnd).toEqual(blogsAtStart)
    })

    test('if the likes property is missing from the request, it will default to 0', async () => {
        
        const newLogin = {
            username: 'root',
            password: 'sekret'
        }

        const loginData = await api
            .post('/api/login')
            .send(newLogin)
        
        const token = loginData.body.token

        const newBlog = {
            title: "Testing supertest",
            author: "Jhul Ochoa",
            url: "https://JCOE-tests-supertest.com/",
        }
    
        const response = await api
            .post('/api/blogs')
            .send(newBlog)
            .set('Authorization', `Bearer ${token}`)
            .expect(201)
        
        expect(response.body.likes).toBe(0)
    })
    
    test('verify that if title or url are missing from the request, it will be treated as a bad request', async () => {

        const newLogin = {
            username: 'root',
            password: 'sekret'
        }

        const loginData = await api
            .post('/api/login')
            .send(newLogin)
        
        const token = loginData.body.token

        const newBlog1 = {
            author: "Jhul Ochoa",
            url: "https://JCOE-tests-supertest.com/"
        }
        await api
            .post('/api/blogs')
            .send(newBlog1)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
    
        const newBlog2 = {
            title: "Testing supertest",
            author: "Jhul Ochoa"
        }
        await api
            .post('/api/blogs')
            .send(newBlog2)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
    })
})

describe('DELETE tests', () => {
    test('succeeds with status code 204 if id is valid', async () => {

        const newLogin = {
            username: 'root',
            password: 'sekret'
        }

        const loginData = await api
            .post('/api/login')
            .send(newLogin)
        
        const token = loginData.body.token

        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]
    
        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization', `Bearer ${token}`)
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

describe('User handling tests', () => {
  
    test('creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb()
  
      const newUser = {
        username: 'mluukkai',
        name: 'Matti Luukkainen',
        password: 'salainen',
      }
  
      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)
  
      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)
  
      const usernames = usersAtEnd.map(u => u.username)
      expect(usernames).toContain(newUser.username)
    })

    test('creation fails with proper statuscode and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()
    
        const newUser = {
          username: 'root',
          name: 'Superuser',
          password: 'salainen',
        }
    
        const result = await api
          .post('/api/users')
          .send(newUser)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('expected `username` to be unique')
    
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('creation fails if username or password has less than 3 characters', async () => {
        const usersAtStart = await helper.usersInDb()
    
        const newUser = {
          username: 'superuser',
          name: 'Superuser',
          password: 'sa',
        }
    
        const result = await api
          .post('/api/users')
          .send(newUser)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('at least 3')
    
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

  })

  


afterAll(async () => {
    await mongoose.connection.close()
})