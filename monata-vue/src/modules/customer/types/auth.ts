export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
}

export interface ValidationErrors {
  [key: string]: string[] | undefined
}
