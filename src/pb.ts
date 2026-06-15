import PocketBase from 'pocketbase'

// 本地开发指向 8090；生产由 Nginx 反代到同源 /，此时用相对地址
// 本项目开发端口用 8091，避开「贴纸机系统管理」占用的 8090
const baseUrl = import.meta.env.DEV ? 'http://127.0.0.1:8091' : '/'
export const pb = new PocketBase(baseUrl)
pb.autoCancellation(false)
