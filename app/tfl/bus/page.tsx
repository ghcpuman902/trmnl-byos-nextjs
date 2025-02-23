import BusStopSearchForm from "./BusStopSearchForm";

export default function BusStopPage() {
  return (
    <div className="container mx-auto p-6 w-full">
      <h1 className="text-2xl font-bold mb-6">Find Bus Stops</h1>
      <BusStopSearchForm />
    </div>
  );
}
