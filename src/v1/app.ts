import express, { NextFunction, Request, Response } from 'express'
import Logger from './iibs/logger'
import cors from 'cors'
import helmet from 'helmet'
import rateLimiter from 'express-rate-limit'
import morganMiddleware from './middlewares/morgan'
import { ErrorCode, ErrorException, errorHandler } from './utils'
import apiRoutes from './routes'
import bodyParser from 'body-parser'
import config from './config'
import DB from './helpers/database'
import { clientResponse } from './helpers/response'
const app = express()



app.disable('x-powered-by')

// Middlewares
const initMiddlewares = () => {
  app.use(cors())
  app.use(helmet())
  app.use(
    cors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true
    })
  )
  // app.use(xss())
  app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 100 requests per windowMs
  }))
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(morganMiddleware)
  app.use(errorHandler)
}

// app.get('/b', (req: Request, res: Response, next: NextFunction) => {
//   throw new ErrorException(ErrorCode.MaximumAllowedGrade, { grade: Math.random() })
//   // or
//   // next(new ErrorException(ErrorCode.MaximumAllowedGrade, { grade: Math.random() }))
// })
// app.use('/auth', apiRoutes)

// routes
const initRoutes = () => {
  app.use('/v1', apiRoutes)
  app.all('/', (req:any, res:any) => {
    clientResponse(res, 200, 'welcome to the DokRx 💊 backend server')
  })
  app.all('**', (req:any, res:any) => clientResponse(res, 401, 'Route not found, try check your browser url'))

  Logger.info('Routers initialized <3')
}

// database
const initDataBaseConnection = async () => {
  await DB.connect()
  Logger.info('database connected, happy hacking 💖')
  return true

}

const initProcessHandler = () => {
  process.on('uncaughtException', (err) => {
  Logger.info('there was an uncaught exception, shutting down! 🤬🤬', err)

  })

  process.on('unhandledRejection', (err) => {
    Logger.info('this rejection wasnt handled, shutting down! 🤬🤬', err)
    process.exit(1)

  })
}

const initServer = (port: number | string) => {
  app.listen(port, () =>
    // console.log(`Server running, Our app is live on PORT: ${port}`)
    Logger.info(`Server running 🏃‍♂️🏃‍♀️, Our app is live 🥳🙌 on PORT: ${port}`)
  )
}

export default {
  start: async () => {

    const dbConnected = await initDataBaseConnection()

    // console.log(dbConnected, "returned from db connection")

    if (dbConnected)
    {
      initMiddlewares()
      
      initRoutes()

      initServer(config.PORT || 3000)

      initProcessHandler()
    }
  
  }, 

  stop: () =>
  {
      Logger.info('exiting applicaton  🤬🤬')
    process.exit(1)
  }
}
