import { Simulate } from 'react-dom/test-utils';
import './friendos.css';

const SmileySun = () => {
    return(
      <div id="sunmoon" className="day">
        <div id="sunmoon-face"></div>
      </div>
    );
  }
  const PurpleFriend = () => {
    return(
      <div id="friend">
        <div id="friend-face"></div>
      </div>
    );
  }

 export {
    PurpleFriend,
    SmileySun
 }
