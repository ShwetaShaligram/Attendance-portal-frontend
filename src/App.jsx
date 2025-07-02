// src/App.jsx
import './axiosSetup'; // 👈 Add this at the top
import AppRouter from './router';
import './axiosSetup'; 

function App() {
  return (
    <div className="App">
      <AppRouter />
    </div>
  );
}

export default App;
