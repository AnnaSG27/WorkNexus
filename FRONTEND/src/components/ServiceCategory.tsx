import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

const ServiceCategory = () => {
  const { category } = useParams();
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetch(`http://localhost:8000/services/services/?category=${category}`)
      .then(res => res.json())
      .then(data => setServices(data));
  }, [category]);

  return (
    <div className="pt-24 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 capitalize">
          Servicios de {category}
        </h1>

        {services.length === 0 ? (
          <p>No hay servicios disponibles en esta categoría</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <h2 className="text-xl font-semibold mb-2">
                    {service.title}
                  </h2>
                  <p className="text-muted-foreground">
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
