export interface ResponseData<T = any> {
  status: String,
  message: string,
  data?: T
}