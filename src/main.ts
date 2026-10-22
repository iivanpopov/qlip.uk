import { mount } from 'svelte'

import App from './App.svelte'

import './assets/styles/fonts.css'
import './assets/styles/global.css'
import { LOCALSTORAGE_CLIENT_ID } from './constants'

if (!localStorage.getItem(LOCALSTORAGE_CLIENT_ID))
  localStorage.setItem(LOCALSTORAGE_CLIENT_ID, crypto.randomUUID())

export default mount(App, {
  target: document.getElementById('app')!,
})
