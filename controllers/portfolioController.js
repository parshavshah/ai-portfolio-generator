export const previewPortfolio = (req, res) => {
  try {
    const portfolioData = req.session.portfolioData;
    if (!portfolioData) {
      return res.status(404).send('Portfolio not found. Please generate a new portfolio.');
    }
    res.render('portfolio', { data: portfolioData.data });
  } catch (error) {
    console.error('Error rendering portfolio:', error);
    res.status(500).send('Error loading portfolio');
  }
}; 