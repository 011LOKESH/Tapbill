// Delete a specific bill item
router.delete('/:id', async (req, res) => {
  try {
    const bill = await BillItem.findById(req.params.id);
    if (bill) {
      await bill.deleteOne();
      res.json({ message: 'Bill deleted' });
    } else {
      res.status(404).json({ message: 'Bill not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}); 