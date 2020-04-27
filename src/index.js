import React from 'react';
// import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import gflow from './common/gflow';
import models from './models';

// ReactDOM.render(<App />, document.getElementById('root'));
gflow.run({
    rootEle: (
        // <React.StrictMode>
            <App />
        // </React.StrictMode>
    ),
    domSelector:'#root',
    models:models,
});


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
