import { useState } from 'react'

import FormItem from '../components/FormItem'
import FormConfig from '../components/FormConfig'
import ItemConfig from '../components/ItemConfig'


function App() {
  return (
    <div className="dynamic-form">
      <FormItem />
      <FormConfig />
      <ItemConfig />
      this is dynamic-form page
    </div>
  )
}

export default App
