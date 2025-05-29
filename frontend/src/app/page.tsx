/**
 * Página de inicio de la aplicación
 * - Muestra una sección hero con un mensaje de bienvenida
 * - Incluye secciones de misión y visión
 * - Destaca las características principales del servicio
 */
export default function HomePage() {
  // Características de la empresa para mostrar en la sección de características
  const features = [
    {
      title: 'Calidad Garantizada',
      description: 'Todos nuestros productos pasan por estrictos controles de calidad.'
    },
    {
      title: 'Envíos Rápidos',
      description: 'Entregamos tus productos en tiempo récord.'
    },
    {
      title: 'Soporte 24/7',
      description: 'Nuestro equipo de soporte está disponible para ayudarte en todo momento.'
    }
  ];

  return (
    <div className="bg-gray-50">
      {/* Sección Hero - Mensaje principal de bienvenida */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Bienvenido a Jazila Bazar
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
            Tu destino para encontrar los mejores productos con la mejor calidad y servicio.
          </p>
        </div>
      </section>

      {/* Sección Acerca de - Misión y Visión */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuestra Misión</h2>
              <p className="text-gray-600">
                Proporcionar a nuestros clientes productos de la más alta calidad, ofreciendo una experiencia de compra excepcional y un servicio al cliente inigualable.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuestra Visión</h2>
              <p className="text-gray-600">
                Ser reconocidos como la tienda líder en nuestro sector, siendo referentes en calidad, innovación y satisfacción del cliente a nivel nacional e internacional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Características - Razones para elegirnos */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            ¿Por qué elegirnos?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
