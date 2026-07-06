import * as Yup from 'yup'

export const messageSchema = Yup.object({
  text: Yup.string().trim().min(1, 'Message vide.').max(2000).required(),
})

export const supportSchema = Yup.object({
  subject: Yup.string().trim().min(4).max(120).required('Sujet obligatoire.'),
  priority: Yup.string().oneOf(['normal', 'important', 'critical']).required(),
  message: Yup.string().trim().min(20, 'Ajoutez au moins 20 caracteres.').max(3000).required(),
})
