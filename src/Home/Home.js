import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
  } from "react-router-dom";
import App from '../App/App';
import './Home.css';

class Home extends React.Component{
    constructor(props){
        super(props);
    }
    render(){
        return(
            <div>
                <Router>
                    <div id="weare"></div>
                    <div style={{display:'flex', flexDirection:'column', zIndex:"100", justifyContent: 'center', alignItems: 'center', height:'100vh',width:'100vw',}}>
                        <div>
                            <div id="box" style={{margin:'auto',
                             width:'250px', height:"200px", border: '1px solid #000',
                              textAlign:'center',
                              display:'flex',
                              alignItems:'center',
                              justifyContent: 'center'
                              }}>
                                <Link to="/friendo">Welcome!</Link>
                            </div>
                        </div>
                    </div>
                    <Switch>
                        <Route path="/friendo">
                            <App/>
                        </Route>
                    </Switch>
                </Router>
            </div>
        );
    }
};

export default Home;