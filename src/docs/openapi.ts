export const openapi_spec = {
  openapi: '3.0.3',
  info: {
    title: 'Coopers To-Do List API',
    version: '1.0.0',
    description:
      'REST API for the Coopers Full Stack Developer challenge. Handles user authentication, a per-user to-do list, and a contact form with email delivery.',
  },
  tags: [
    { name: 'Auth', description: 'User registration, login and session management' },
    { name: 'To-Do', description: 'CRUD operations for the authenticated user to-do list' },
    { name: 'Contact', description: 'Contact form with email delivery via Resend' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'JWT token set automatically after a successful login or register. Expires in 1 hour.',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Todo: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          text: { type: 'string', example: 'Buy groceries' },
          done: { type: 'boolean', example: false },
          order: { type: 'integer', example: 0 },
        },
      },
      UserRegister: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'John Doe' },
        },
      },
      UserLogin: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'NotFoundError' },
          action: { type: 'string', example: 'Check the ID and try again.' },
          message: { type: 'string', example: 'Item not found.' },
          status_code: { type: 'integer', example: 404 },
        },
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'ValidationError' },
          action: { type: 'string', example: 'Fix the highlighted fields and try again.' },
          message: { type: 'string', example: 'Invalid input data.' },
          status_code: { type: 'integer', example: 400 },
          fields: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: { type: 'string' },
            },
            example: { email: ['Invalid email address.'] },
          },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', minLength: 2, example: 'John Doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: {
                    type: 'string',
                    minLength: 8,
                    description:
                      'Min 8 chars, requires uppercase, lowercase, number, and special character.',
                    example: 'Password@123',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully — sets httpOnly cookie `token` (expires in 1h)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/UserRegister' } },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
          409: {
            description: 'Email already in use',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in and receive a session cookie',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', minLength: 1, example: 'Password@123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful — sets httpOnly cookie `token` (expires in 1h)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/UserLogin' } },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Clear the session cookie',
        responses: {
          200: {
            description: 'Logged out successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string', example: 'Logged out successfully.' } },
                },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Return the authenticated user',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'Current user data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
          401: {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/to-do': {
      get: {
        tags: ['To-Do'],
        summary: 'List all to-do items for the authenticated user',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of todos ordered by done status and position',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    todos: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Todo' },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['To-Do'],
        summary: 'Create a new to-do item',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: { type: 'string', minLength: 1, example: 'Buy groceries' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Todo created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { todo: { $ref: '#/components/schemas/Todo' } },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
          401: {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/to-do/{id}': {
      put: {
        tags: ['To-Do'],
        summary: 'Update the text of a to-do item',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: { type: 'string', minLength: 1, example: 'Buy groceries and cook dinner' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Todo updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { todo: { $ref: '#/components/schemas/Todo' } },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
          401: {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Todo not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['To-Do'],
        summary: 'Delete a to-do item',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          204: { description: 'Todo deleted' },
          401: {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Todo not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/to-do/{id}/check': {
      patch: {
        tags: ['To-Do'],
        summary: 'Toggle the done status of a to-do item',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Done status toggled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { todo: { $ref: '#/components/schemas/Todo' } },
                },
              },
            },
          },
          401: {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Todo not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/contact': {
      post: {
        tags: ['Contact'],
        summary: 'Send a contact form message via email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'phone', 'message'],
                properties: {
                  name: { type: 'string', minLength: 2, example: 'Jane Doe' },
                  email: { type: 'string', format: 'email', example: 'jane@example.com' },
                  phone: { type: 'string', minLength: 10, example: '(11) 91234-5678' },
                  message: {
                    type: 'string',
                    minLength: 10,
                    example: 'Hello! I would like to get in touch with your team.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Message sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Message sent successfully.' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
              },
            },
          },
          500: {
            description: 'Email delivery failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
}
