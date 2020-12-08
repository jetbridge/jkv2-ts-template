import { User, PaginationQuery, PaginatedResponse } from "jkv2-core"
import { API } from "aws-amplify"
import queryString from "qs"
import Axios from 'axios'


const apiName = process.env.REACT_APP_API_NAME // name of the API Gateway API

const myInit = {
    // OPTIONAL
    headers: {}, // OPTIONAL
    response: true,
    queryStringParameters: {
        // OPTIONAL
    },
}

export const getUsers = async (pagination?: PaginationQuery): Promise<User[]> => {
    const path = `/user`

    const result: PaginatedResponse<User> = (await API.get(process.env.REACT_APP_API_NAME, path, myInit)).data

    return result.items
}