import React from 'react';
import ArtworkTable from './components/ArtworkTable'; // Import your main component

const App: React.FC = () => {
    return (
        <div className="app-container">
            <h1>Artwork Gallery</h1>
            <ArtworkTable />
        </div>
    );
};

export default App;
