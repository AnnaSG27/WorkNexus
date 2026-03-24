import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import ServiceCard from "./ServiceCard";

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => (
              <ServiceCard
                key={index}
                image={service.image || "https://via.placeholder.com/400x300"}
                title={service.title}
                freelancer={{
                  name: service.freelancer_name || "Freelancer",
                  avatar: service.freelancer_avatar || "https://via.placeholder.com/40",
                  level: service.freelancer_level || "Nivel desconocido",
                }}
                rating={service.rating || 0}
                reviews={service.reviews || 0}
                price={service.price || 0}
                deliveryTime={service.delivery_time || "N/A"}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCategory;
