require("dotenv-flow").config()
import { Connection, ConnectionManager, ConnectionOptions, createConnection, getConnectionManager } from "typeorm"
import { SnakeNamingStrategy } from "typeorm-naming-strategies/snake-naming.strategy"
import { User } from "../model/User"
import * as pg from "pg"
import { LoggerOptions } from "typeorm/logger/LoggerOptions"

// instrument queries with xray
if (!process.env.USE_LOCAL_DB) {
    const AWSXRay = require("aws-xray-sdk")
    AWSXRay.capturePostgres(pg)
}

// list of entities from core go here
const ALL_ENTITIES = [User]

const CONNECTION_NAME = "default"

/**
 * Database manager class
 * Taken from https://medium.com/safara-engineering/wiring-up-typeorm-with-serverless-5cc29a18824f
 * This MAY NOT BE THE BEST WAY TO GET/CACHE DB CONNECTIONS!
 */
export class Database {
    private connectionManager: ConnectionManager

    constructor() {
        this.connectionManager = getConnectionManager()
    }

    public async getConnection(): Promise<Connection> {
        let connection: Connection

        if (this.connectionManager.has(CONNECTION_NAME)) {
            connection = await this.connectionManager.get(CONNECTION_NAME)

            if (!connection.isConnected) {
                connection = await connection.connect()
            }
        } else {
            connection = await createConnection(getConnectionOptions())
        }

        return connection
    }
}

export function getConnectionOptions(): ConnectionOptions {
    let connectionOptions: ConnectionOptions
    let logging: LoggerOptions
    if (process.env.SQL_ECHO) {
        logging = ["query", "error"]
    }
    else {
        logging = ["error"]
    }
    console.log(`LOCAL_DB: ${process.env.USE_LOCAL_DB}`)
    if (process.env.USE_LOCAL_DB) {
        console.debug("Using local database...")
        // local DB
        connectionOptions = {
            entities: ALL_ENTITIES,
            type: `postgres`,
            port: 5432,
            database: process.env.DB_NAME,
            host: process.env.DB_HOST,
            namingStrategy: new SnakeNamingStrategy(),
            logging: logging, // log queries
        }
    } else {
        // aurora sls
        connectionOptions = {
            entities: ALL_ENTITIES,
            type: "aurora-data-api-pg",
            database: "mercury",
            secretArn: "arn:aws:secretsmanager:us-east-1:423516771215:secret:mercury/marie-ccsf/rds/credentials-J9F7N7",
            resourceArn: "arn:aws:rds:us-east-1:423516771215:cluster:mercury-marie-ccsf",
            region: "us-east-1",
            logging: logging, // log queries
            name: CONNECTION_NAME,
            namingStrategy: new SnakeNamingStrategy(),
        }
    }

    // Don't need a pwd locally
    if (process.env.DB_PASSWORD) {
        Object.assign(connectionOptions, {
            password: process.env.DB_PASSWORD,
        })
    }

    return connectionOptions
}