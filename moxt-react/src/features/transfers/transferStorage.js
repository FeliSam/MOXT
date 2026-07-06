import { createLocalRepository } from '../../services/localRepository'

const repository = createLocalRepository('moxt-transfers-v1')

export const transferStorage = {
  read: repository.list,
  write: repository.save,
}
