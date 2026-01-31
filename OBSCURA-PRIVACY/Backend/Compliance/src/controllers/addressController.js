import rangeClient from '../config/rangeClient.js';

export const searchAddresses = async (req, res, next) => {
  try {
    const { networks, status } = req.query;
    
    let queryString = '';
    if (networks) {
      const networkArray = networks.split(',');
      queryString += networkArray.map(n => `networks=${n}`).join('&');
    }
    if (status) {
      const statusArray = status.split(',');
      if (queryString) queryString += '&';
      queryString += statusArray.map(s => `status=${s}`).join('&');
    }

    const url = `/v2/addresses${queryString ? '?' + queryString : ''}`;
    const response = await rangeClient.get(url);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
};

export const getAddressStats = async (req, res, next) => {
  try {
    const { network, address } = req.query;
    
    if (!network || !address) {
      return res.status(400).json({ 
        error: 'network and address parameters are required' 
      });
    }

    const response = await rangeClient.get('/v1/address/stats', {
      params: { network, address }
    });
    
    res.json(response.data);
  } catch (error) {
    next(error);
  }
};

export const checkAddressCompliance = async (req, res, next) => {
  try {
    const { addresses } = req.body;
    
    if (!addresses || !Array.isArray(addresses)) {
      return res.status(400).json({ 
        error: 'addresses array is required in request body' 
      });
    }

    const results = await Promise.all(
      addresses.map(async ({ network, address }) => {
        try {
          const queryString = `networks=${network}&addresses=${address}&validateSearch=true`;
          const response = await rangeClient.get(`/v1/address/labels/search?${queryString}`);
          
          const addressData = response.data[0] || {};
          return {
            address,
            network,
            compliant: !addressData.malicious,
            malicious: addressData.malicious || false,
            tags: addressData.tags || [],
            entity: addressData.entity || null,
            category: addressData.category || null,
            name_tag: addressData.name_tag || null
          };
        } catch (err) {
          return {
            address,
            network,
            error: err.response?.data?.message || err.message,
            compliant: null
          };
        }
      })
    );

    res.json({ results });
  } catch (error) {
    next(error);
  }
};
