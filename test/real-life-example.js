'use strict'

const {deepStrictEqual: deepEq} = require('node:assert/strict')
const {Bobson_Builder} = require('../lib/index.js')

describe('real life example', () => {
  it('abc', () => {
    const common_defs = {
      "int_4_id": "int_4 1 max",
      "date": "string 10 10 ^\\d{4}-\\d{2}-\\d{2}$",
      "date_time": "string 24 24 ^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
      "page_number": "int_4 1 max",
      "search_term": "string 0 256",
      "int_4_id_params": ["object",{
        "+ id": "int_4_id",
      }],
    }

    const auth_defs = {
      "username": "string 5 64 ^\\S.*\\S$",
      "password": "string 8 64 ^\\S.*\\S$",
      "email": "string 0 256 ^\\S+@\\S+\\.\\S{2,}$",
      "credentials": ["object",{
        "+ username": "username",
        "+ password": "password",
      }],
      "credentials_change": ["object",{
        "+ username": "username",
        "+ old_password": "password",
        "+ new_password": "password",
      }],
      "credentials_with_captcha": ["object",{
        "< credentials": ["+ username", "+ password"],
        "+ captcha_token": "string 1 2048",
      }],
      "post_password": ["object",{
        "+ body": "credentials_change",
      }],
      "post_signup": ["object",{
        "+ body": "credentials_with_captcha",
      }],
      "post_login": ["object",{
        "+ body": "credentials",
      }],
      "post_google_login": ["object",{
        "+ body": ["object",{
          "+ credential": "string 1 2048",
        }],
      }],
      "post_email_verify": ["object",{
        "+ body": ["object",{
          "+ nonce": "string 1 64",
        }],
      }],
      "post_email": ["object",{
        "+ body": ["object",{
          "+ email": "email",
        }],
      }],
    }

    const user_defs = {
      "user": ["object",{
        "- id": "int_4_id",
        "- username": "username",
        "+ is_active": "bool",
        "- created_at": "date_time",
        "- updated_at": "?date_time",
        "- last_seen_at": "?date_time",
      }],
      "user_query": ["object",{
        "+ page": "page_number",
        "- search": "search_term",
      }],
      "get_user": ["object",{
        "+ query": "user_query",
      }],
      "post_user": ["object",{
        "+ body": "credentials",
      }],
      "put_user": ["object",{
        "+ params": "int_4_id_params",
        "+ body": "user",
      }],
      "del_user": ["object",{
        "+ params": "int_4_id_params",
      }],
    }

    const image_defs = {
      "images_query": ["object",{
        "+ page": "page_number",
      }],
      "get_image": ["object",{
        "+ params": "int_4_id_params",
      }],
      "put_image": ["object",{
        "+ params": "int_4_id_params",
      }],
      "del_image": ["object",{
        "+ params": "int_4_id_params",
      }],
      "get_images": ["object",{
        "+ query": "images_query",
      }],
    }

    const definitions = {
      ...common_defs,
      ...auth_defs,
      ...user_defs,
      ...image_defs,
    }
    try {
      const bobson = new Bobson_Builder()
      // bobson.add_base_types(base_types)
      bobson.add_derived_types(definitions)
      // bobson.add_parser_functions(parser_functions)
      const login_parser = bobson.get_parser('post_login')
      const login_payload = JSON.stringify({
        body: {
          username: 'honono',
          password: 'bononoho',
        },
      })
      const login_result = login_parser.parse(login_payload)
      deepEq(login_result, {body: {username: 'honono', password: 'bononoho'}})

      const put_user_parser = bobson.get_parser('put_user')
      const put_user_payload = JSON.stringify({
        params: {
          id: "22",
        },
        body: {
          username: 'zbychu',
          is_active: 'true',
          created_at: '2022-03-14T12:00:03.000Z',
        },
      })
      const put_user_result = put_user_parser.parse(put_user_payload)
      deepEq(put_user_result, {
        params: { id: 22 },
        body: {
          username: 'zbychu',
          is_active: true,
          created_at: '2022-03-14T12:00:03.000Z',
        },
      })
    }
    catch (err) {
      console.log('message:', err.message)
      console.log('path:', err.path)
      throw err
    }
  })
})
