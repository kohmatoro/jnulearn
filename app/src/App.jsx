import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { TimetableProvider } from "./context/TimetableContext";

export default function App() {
  return (
    <TimetableProvider>
      <RouterProvider router={router} />
    </TimetableProvider>
  );
}