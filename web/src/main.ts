import { mount } from 'svelte'

import App from './App.svelte'
import { LOCALSTORAGE_CLIENT_ID } from './constants'

import './assets/styles/global.css'

if (!localStorage.getItem(LOCALSTORAGE_CLIENT_ID))
  localStorage.setItem(LOCALSTORAGE_CLIENT_ID, crypto.randomUUID())

export default mount(App, { target: document.getElementById('app')! })
