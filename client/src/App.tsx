import { HomePage } from "./pages/HomePage/HomePage";
import { PageLoader } from "./components/PageLoader/PageLoader";

function App() {
  return (
    <PageLoader>
      <HomePage />
    </PageLoader>
  );
}

export default App;
