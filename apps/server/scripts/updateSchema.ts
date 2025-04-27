import fs from 'fs/promises'
import { printSchema } from 'graphql/utilities'
import path from 'path'

import { schema } from '../src/schema/schema'
;(async () => {
  const paths = [path.join(__dirname, '../src/schema/schema.graphql')]

  for (const path of paths) {
    await fs.writeFile(path, printSchema(schema), {
      encoding: 'utf-8'
    })
  }

  process.exit(0)
})()
