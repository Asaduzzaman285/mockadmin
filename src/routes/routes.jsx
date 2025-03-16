import React from 'react';
import Homepage from '../components/Homepage';
import UserPage from '../components/UserPage';
import Memberpage from '../components/Memberpage';
import Eventpage from '../components/Eventpage';
import Contentpage from '../components/Contentpage';
import SuccessStories from '../components/SuccessStories';
import Sliders from '../components/Sliders';
import Ads from '../components/Ads';
import Orders from '../components/Orders';
import Tests from '../components/Tests';
import MockTest from '../components/MockTest';

const routes = [
  { path: '/admin/home', exact: true, name: 'Homepage', component: (props) => <Homepage {...props} /> },
  { path: '/admin/user', exact: true, name: 'Userpage', component: (props) => <UserPage {...props} /> },
  // { path: '/admin/members', exact: true, name: 'Memberpage', component: (props) => <Memberpage {...props} /> },
  // { path: '/admin/events', exact: true, name: 'Eventpage', component: (props) => <Eventpage {...props} /> },
  // { path: '/admin/products', exact: true, name: 'Contentpage', component: (props) => <Contentpage {...props} /> },
  // { path: '/admin/success_stories', exact: true, name: 'SuccessStories', component: (props) => <SuccessStories {...props} /> },
  // { path: 'admin/sliders', exact: true, name: 'Sliders', component: (props) => <Sliders {...props} /> },
  // { path: 'admin/ads', exact: true, name: 'Ads', component: (props) => <Ads {...props} /> },
  // { path: 'admin/orders', exact: true, name: 'Orders', component: (props) => <Orders {...props} /> },
  { path: 'admin/tests', exact: true, name: 'Tests', component: (props) => <Tests {...props} /> },

  
  
];

export default routes;