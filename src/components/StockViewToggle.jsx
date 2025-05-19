import { ButtonGroup, Button } from "react-bootstrap";
import { FaTable, FaTh } from "react-icons/fa";

const StockViewToggle = ({ view, setView }) => {
  return (
    <ButtonGroup className="mb-3">
      <Button
        variant={view === "card" ? "primary" : "outline-primary"}
        onClick={() => setView("card")}
      >
        <FaTh /> Card View
      </Button>
      <Button
        variant={view === "table" ? "primary" : "outline-primary"}
        onClick={() => setView("table")}
      >
        <FaTable /> Table View
      </Button>
    </ButtonGroup>
  );
};

export default StockViewToggle;
