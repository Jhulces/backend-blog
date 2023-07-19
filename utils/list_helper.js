const _ = require('lodash')

const dummy = (blogs) => 1

const totalLikes = (blogs) => blogs.reduce((acc, item) => acc + item.likes, 0)

const favoriteBlog = (blogs) => _.pick(blogs.reduce((acc, item) => item.likes > acc.likes? item : acc, blogs[0]),['title', 'author', 'likes'])

const mostBlogs = (blogs) => {
    const blogsByAuthor = _.groupBy(blogs, 'author')
    const blogsCountByAuthor = _.map(blogsByAuthor, (blogs, author) => ({author, blogs: blogs.length}))
    const authorWithMostBlogs = _.maxBy(blogsCountByAuthor, 'blogs')

    return authorWithMostBlogs
}

const mostLikes = (blogs) => {
    const blogsByAuthor = _.groupBy(blogs, 'author')
    const likesCountByAuthor = _.map(blogsByAuthor, (blogs, author) => ({author, likes: totalLikes(blogs)}))
    const authorWithMostLikes = _.maxBy(likesCountByAuthor, 'likes')

    return authorWithMostLikes
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}

