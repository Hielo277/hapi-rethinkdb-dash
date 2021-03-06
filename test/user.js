'use strict'

const Lab = require('lab')
const Code = require('code')

const Hapi = require('hapi')
const server = new Hapi.Server()
server.connection({ port: 3000 })

const Plugins = require('../server/config/plugins')
const Config = require('../server/config/database')('test')
const ViewConfig = require('../server/config/settings')

const thinky = require('thinky')(Config)
const r = thinky.r
const User = require('../server/models/').User

const lab = exports.lab = Lab.script()
const experiment = lab.experiment
const test = lab.test
const before = lab.before
const after = lab.after

experiment('User methods:', function () {
  before(function (done) {
    server.register(Plugins, function (err) {
      if (err) {
        console.error(err)
        throw err
      }

      server.views(ViewConfig.hapi.options.views)

      done()
    })
  })

  after(function (done) {
    r.table('User').delete().run()
    thinky._clean()
    done()
  })

  test('test user create', function (done) {
    const options = {
      url: '/signup',
      method: 'POST',
      payload: {
        email: 'info@futurestud.io',
        password: 'password'
      }
    }

    server.inject(options, () => {
      User.findByEmail('info@futurestud.io').then(function (user) {
        Code.expect(user).to.be.an.object()
        done()
      })
    })
  })

  test('Should not create a second user with the same email address', function (done) {
    const options = {
      url: '/signup',
      method: 'POST',
      payload: {
        email: 'info@futurestud.io',
        password: 'password'
      }
    }

    server.inject(options, (reply) => {
      Code.expect(reply.statusCode).to.equal(409)

      User.run().then(function (users) {
        Code.expect(users.length).to.equal(1)
        done()
      })
    })
  })

  test('Should not create user without email', function (done) {
    const options = {
      url: '/signup',
      method: 'POST',
      payload: {
        password: 'password'
      }
    }

    server.inject(options, (reply) => {
      Code.expect(reply.statusCode).to.equal(400)

      User.run().then(function (users) {
        Code.expect(users.length).to.equal(1)
        done()
      })
    })
  })

  test('Should not create user without password', function (done) {
    const options = {
      url: '/signup',
      method: 'POST',
      payload: {
        email: 'info@futurestud.io'
      }
    }

    server.inject(options, (reply) => {
      Code.expect(reply.statusCode).to.equal(400)

      User.run().then(function (users) {
        Code.expect(users.length).to.equal(1)
        done()
      })
    })
  })

  test('Should update user data', function (done) {
    User.run().then(function (users) {
      const options = {
        url: '/profile',
        method: 'POST',
        payload: {
          name: 'marcus'
        },
        credentials: users[ 0 ]
      }

      server.inject(options, (reply) => {
        Code.expect(reply.statusCode).to.equal(200)

        User.run().then(function (users) {
          Code.expect(users.length).to.equal(1)
          Code.expect(users[ 0 ].name).to.equal('marcus')
          Code.expect(users[ 0 ].email).to.equal('info@futurestud.io')
          done()
        })
      })
    })
  })

  test('Should not update user data: url is wrong', function (done) {
    User.run().then(function (users) {
      const options = {
        url: '/profile',
        method: 'POST',
        payload: {
          url: '123'
        },
        credentials: users[ 0 ]
      }

      server.inject(options, (reply) => {
        Code.expect(reply.statusCode).to.equal(400)
        done()
      })
    })
  })

  test('Should not change password: old password wrong', function (done) {
    User.run().then(function (users) {
      const options = {
        url: '/profile/change-password',
        method: 'POST',
        payload: {
          old_password: 'wrongpassword',
          new_password: 'doesntmatter',
          confirm_new_password: 'doesntmatter'
        },
        credentials: users[ 0 ]
      }

      server.inject(options, (reply) => {
        Code.expect(reply.statusCode).to.equal(400)
        done()
      })
    })
  })

  test('Should not change password: confirm is different to new', function (done) {
    User.run().then(function (users) {
      const options = {
        url: '/profile/change-password',
        method: 'POST',
        payload: {
          old_password: 'password',
          new_password: 'newpassword',
          confirm_new_password: 'newpassword-wrong'
        },
        credentials: users[ 0 ]
      }

      server.inject(options, (reply) => {
        Code.expect(reply.statusCode).to.equal(400)
        done()
      })
    })
  })

  test('Should not change password: new too short', function (done) {
    User.run().then(function (users) {
      const options = {
        url: '/profile/change-password',
        method: 'POST',
        payload: {
          old_password: 'password',
          new_password: 'short',
          confirm_new_password: 'short'
        },
        credentials: users[ 0 ]
      }

      server.inject(options, (reply) => {
        Code.expect(reply.statusCode).to.equal(400)
        done()
      })
    })
  })

  test('Should change the password', function (done) {
    User.run().then(function (users) {
      const options = {
        url: '/profile/change-password',
        method: 'POST',
        payload: {
          old_password: 'password',
          new_password: 'newpassword',
          confirm_new_password: 'newpassword'
        },
        credentials: users[ 0 ]
      }

      server.inject(options, (reply) => {
        Code.expect(reply.statusCode).to.equal(200)
        done()
      })
    })
  })

})
