import { WithdrawMutation } from './WithdrawMutation'
import { TransferMutation } from './TransferMutation'

export const transactionMutations = {
  Transfer: TransferMutation,
  Withdraw: WithdrawMutation
}
