import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '../components/Layout';
import Practice from '../pages/Practice';
import DialoguePlayer from '../pages/DialoguePlayer';
import Dialogues from '../pages/Dialogues';
import NotFound from '../pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Practice />,
      },
      {
        path: 'dialogues',
        children: [
          {
            index: true,
            element: <Dialogues />,
          },
          {
            path: ':categoryId',
            element: <Dialogues />,
          }
        ]
      },
      {
        path: 'practice/:categoryId/:dialogueId',
        element: <DialoguePlayer />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;