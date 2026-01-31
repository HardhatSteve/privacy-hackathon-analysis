import React from 'react';

const useCases = [
  {
    title: 'Privacy-Preserving Geofencing',
    description: 'Grant access to secure assets without revealing GPS coordinates',
    icon: '🔐',
  },
  {
    title: 'Decentralized Gig Work',
    description: 'Verify contractor presence at job sites while preserving privacy',
    icon: '👷',
  },
  {
    title: 'Loyalty Programs',
    description: 'Reward customers for visits without tracking movement history',
    icon: '🎁',
  },
  {
    title: 'Local Governance',
    description: 'Enable privacy-preserving voting on neighborhood proposals',
    icon: '🗳️',
  },
];

export function UseCases() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Use Cases</h2>
          <p className="text-xl text-gray-400">
            Zero-knowledge proofs enabling privacy-preserving location verification
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((useCase, idx) => (
            <div key={idx} className="card-hover">
              <div className="text-4xl mb-3">{useCase.icon}</div>
              <h3 className="text-xl font-bold mb-2">{useCase.title}</h3>
              <p className="text-gray-400">{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
