import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

const ServiceCategory = () => {
  const { category } = useParams();
  const [services, setServices] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`http://localhost:8000/services/services/?category=${category}`)
      .then(res => res.json())
      .then(data => setServices(data));
  }, [category]);

  const filteredServices = services.filter(service =>
    service.title.toLowerCase().includes(search.toLowerCase()) ||
    service.description.toLowerCase().includes(search.toLowerCase()) ||
    (service.freelancer_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-24 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 capitalize">
          Servicios de {category}
        </h1>

        <input
          type="text"
          placeholder="Buscar servicios..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {filteredServices.length === 0 ? (
          <p>No hay servicios disponibles en esta categoría</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredServices.map((service, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col gap-2">
                  
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-semibold">
                      {service.title}
                    </h2>

                    {service.freelancer_name && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {service.freelancer_name}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCategory;
