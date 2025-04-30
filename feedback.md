## Postman

O arquivo postman.json foi gerado automaticamente pela biblioteca 
(GraphQL to Postman)[https://www.npmjs.com/package/graphql-to-postman].

## Prettier

```ts
;(async () => {
  await connectDatabase()
  ...
```

O Prettier formata automaticamente o arquivo e insere o ";" antes da IIFE.

## GraphQL

```ts
createGraphqlWs(server, '/graphql/ws', {
  schema,
  context: await getContext()
})

createGraphqlWs(server, '/console/graphql/ws', {
  schema,
  context: async () => getContext()
})
```

No boilerplate do projeto existe Subscriptions que exigem o uso de WebSocket.
Apesar de não estar utilizando, esqueci de remover o código.

## Arquivo a mais

Existe um arquivo `schema.graphql` no diretório `src/schema/schema.graphql` 
que é o schema do GraphQL. Acredito que alterando o arquivo de script que 
gera esse arquivo eu mudei o path final e acabei esquecendo.

## Initial balance

Pelo fato de não ter um jeito de adicionar saldo em uma conta,
criei uma forma do usuário ter um saldo inicial. Em uma aplicação real, 
isso não seria possível.

## Broker

Pra simular uma API real, criei um broker que envia um evento a cada operação
realizada.

## Refresh balance

Dentro da conta, existe um campo 'readonlyBalance' que é o saldo de readonly
de uma conta. Esse campo não é confiável para garantir que a conta tem o saldo
em transações, mas serve como "cache" quando você quer ver o saldo da conta 
sem fazer uma nova consulta ao banco de dados.

Nesse caso do `balance`, eu imaginei uma interface que o usuário teria o saldo
da conta disponível e um botão de refresh que atualiza o saldo.

## Modelagem

A modelagem do banco de dados foi feita com o intuito de ser simples:

- `Account`:
  - `id`: id da conta
  - `name`: nome da conta
  - `readonlyBalance`: saldo readonly da conta
  - `createdAt`: data de criação da conta
  - `updatedAt`: data de atualização da conta
- `Transaction`:
  - `description`: descrição da transação
  - `idempotencyKey`: chave de idempotência da transação
  - `entries`: 
    - `accountId`: id da conta
    - `debit`: valor a ser adicionado no saldo
    - `credit`: valor a ser subtraído do saldo
    - `description`: descrição da entrada
  
Cada transação tem duas entradas, uma de débito e outra de crédito. Eu me baseei
no conceito de *double entry bookkepping* que me deparei na primeira vez no
projeto [Firefly III](https://www.firefly-iii.org/).

Eu tinha planejado em criar um registro de transação para cada entrada, mas
fiquei confuso por conta da idempotência - talvez fosse melhor repensar a 
estratégia de idempotência.

> **_Observação:_** talvez eu tenha confundido o campo de `debit` e `credit`
> e o correto seria `debit` ser o valor a ser subtraído do saldo e `credit` o
> valor a ser adicionado. Além disso, as operações de saldo inicial e saque
> contam com apenas uma entrada, o que não faz sentido com a modelagem
> de *double entry bookkepping*.

## Query

```ts
const result = await Transaction.aggregate([
  {
    $unwind: '$entries'
  },
  {
    $match: {
      'entries.accountId': accountId
    }
  },
  {
    $group: {
      _id: null,
      balance: {
        $sum: {
          $subtract: ['$entries.debit', '$entries.credit']
        }
      }
    }
  }
])
```

Aqui eu pensei que consultando e retornando diretamente do banco seria melhor,
tenho noção que o `$unwind` é uma operação custosa, mas não tenho noção	de como
fazer isso de forma mais eficiente.

Sobre a questão da validação: eu pensei por uma questão de *type-safety* e
algum edge case que poderia acontecer, mas acredito que não seja necessário.

## Idempotência 

A idempotência é passada através do header `x-idempotency-key` e é 
utilizada para evitar que o mesmo evento seja processado mais de uma vez. Eu
usei uma abordagem de chave global, mas acredito que seria mais interessante se 
fosse único por conta.

### Aleatória

No caso `o randomUUID()` só acontece quando o usuário está criando uma conta com
saldo inicial. Talvez fosse melhor exigir que o usuário passasse a chave de
idempotência?

## Withdrawal (Saque)

O saque é feito através de uma transação com apenas uma entrada e representa
uma saída do sistema.

## Deposit/Transaction

Errei no termo "deposit", o correto seria "transfer from account".

## Consistência no saldo

A consistência do saldo é garantida através da verificação do saldo na query
mostrada anteriormente.

## Duplicidade

É garantido que não haja duplicidade de transações através do uso da chave de
idempotência. Ao tentar criar uma transação com a mesma chave, o sistema irá
retornar:

- Caso ambas as contas (de destino e origem) sejam as mesmas, retornará a 
transação já existente.
- Caso contrário, retornará um erro de chave duplicada.

## Concorrência

Como o saldo é sempre verificado antes de realizar uma transação, acredito que 
não há risco  de lidar com problemas em concorrência. 
Se duas operações de saque forem feitas,
a que for escrita primeiro no banco de dados será a que irá prevalecer.

## Replica Set

Para casos de réplicas, o ideal para `writeConcern` seria `majority` e
também `majority` no `readConcern`. Isso garante que a operação de escrita
e leitura sejam feitas na maioria dos nós do cluster.

## Integração com outras APIs

Não pensei em como integraria com outras APIs, mas acredito que o ideal seria
adicionar uma conta que representa um serviço externo e criar uma transação
de destino/origem para esse serviço. Nesse caso precisariam ser criado tipos
de contas pois existem operações (como saque) que não fazem sentido dependendo
do serviço.
