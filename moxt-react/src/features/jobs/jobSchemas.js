import * as Yup from 'yup'

export const jobSchema = Yup.object({
  title: Yup.string().trim().min(4).required('Titre obligatoire.'),
  sector: Yup.string().trim().required('Secteur obligatoire.'),
  location: Yup.string().trim().required('Lieu obligatoire.'),
  contractType: Yup.string().trim().required('Type obligatoire.'),
  salary: Yup.string().trim().required('Remuneration obligatoire.'),
  description: Yup.string().trim().min(30, 'Ajoutez au moins 30 caracteres.').required(),
  requirements: Yup.string().trim().min(10).required('Profil recherche obligatoire.'),
})

export const applicationSchema = Yup.object({
  message: Yup.string().trim().min(20, 'Ajoutez au moins 20 caracteres.').required(),
})
