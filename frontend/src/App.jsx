import './App.css'
import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {

  const [jokes, setJokes] = useState([])

  useEffect(()=>{
    axios.get('/api/jokes').then((res)=>{
      console.log(res)
      setJokes(res.data)
      console.log(jokes)
    }
    ).catch((error)=>console.log(error))
    
  }, [])

  return (
    <>
    <h1>Hello world</h1>
    {
      jokes.map((joke)=>
        <p>{joke.joke}</p>
      )
    }
    </>
  )
}

export default App
