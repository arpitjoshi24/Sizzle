
const kitchenService = require("./kitchen.service");

exports.getKitchenQueue = async (req, res) => {
  try {
    const queue = await kitchenService.getKitchenQueue();

    const visibleQueue = queue.filter((entry) => entry.order);

    return res.status(200).json({
      success: true,
      count: visibleQueue.length,
      queue: visibleQueue
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateKitchenStatus = async (req, res) => {
  try {
    const queue = await kitchenService.updateKitchenStatus({
      queueId: req.params.id,
      status: req.body.status,
      userId: req.user.id
    });

    return res.status(200).json({
      success: true,
      message: `Kitchen order marked ${queue.status}`,
      queue
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};
