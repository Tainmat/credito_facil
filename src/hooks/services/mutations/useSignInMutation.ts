import { useMutation } from '@tanstack/react-query'
import { signIn } from '../../../api/accounts'

export function useSignInMutation() {
  return useMutation({
    mutationFn: ({ email, senha }: { email: string; senha: string }) =>
      signIn(email, senha)
  })
}
