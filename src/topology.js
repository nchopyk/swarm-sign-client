const topology = {
  'ip': '192.168.0.104',
  'port': 8002,
  'rating': 0.3345,
  'connectedClients': [
    {
      'ip': '192.168.0.105',
      'port': 8003,
      'rating': 0.3951,
      'connectedClients': [
        {
          'ip': '192.168.0.107',
          'port': null,
          'rating': null,
          'connectedClients': null
        },
        {
          'ip': '192.168.0.108',
          'port': null,
          'rating': null,
          'connectedClients': null
        },
        {
          'ip': '192.168.0.109',
          'port': null,
          'rating': null,
          'connectedClients': null
        }
      ]
    },
    {
      'ip': '192.168.0.106',
      'port': 8004,
      'rating': 0.3875,
      'connectedClients': [
        {
          'ip': '192.168.0.110',
          'port': null,
          'rating': null,
          'connectedClients': null
        },
        {
          'ip': '192.168.0.111',
          'port': null,
          'rating': null,
          'connectedClients': null
        },
        {
          'ip': '192.168.0.112',
          'port': null,
          'rating': null,
          'connectedClients': null
        }
      ]
    },
    {
      'ip': '192.168.0.107',
      'port': 8005,
      'rating': 0.5621,
      'connectedClients': [
        {
          'ip': '192.168.0.113',
          'port': null,
          'rating': null,
          'connectedClients': null
        }
      ]
    }
  ]
};

module.exports = topology;
