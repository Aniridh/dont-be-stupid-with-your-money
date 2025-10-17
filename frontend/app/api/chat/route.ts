import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      );
    }

    // In STUB_MODE, generate contextual responses based on the user's question
    const userQuery = lastUserMessage.content.toLowerCase();
    
    let reply = "";
    
    if (userQuery.includes("aapl") || userQuery.includes("apple")) {
      reply = "🍎 **AAPL Analysis:**\n\n" +
              "• Current P/E ratio: 28.5 (above threshold of 25)\n" +
              "• Risk level: **Medium-High** due to valuation concerns\n" +
              "• Recommendation: Consider reducing position by 3-5%\n" +
              "• Technical indicators show potential resistance at $180\n\n" +
              "The stock appears overvalued based on current fundamentals.";
    } else if (userQuery.includes("tsla") || userQuery.includes("tesla")) {
      reply = "⚡ **TSLA Analysis:**\n\n" +
              "• RSI: 25.3 (oversold territory)\n" +
              "• Risk level: **High** but opportunity present\n" +
              "• Recommendation: Consider increasing position by 2-3%\n" +
              "• Recent news sentiment: Mixed (supply chain concerns)\n\n" +
              "Oversold conditions suggest a potential buying opportunity.";
    } else if (userQuery.includes("rebalance") || userQuery.includes("portfolio")) {
      reply = "📊 **Portfolio Rebalance Analysis:**\n\n" +
              "• Current drift: 5.2% (above 5% threshold)\n" +
              "• Rebalance needed: **Yes**\n" +
              "• Suggested actions:\n" +
              "  - Reduce AAPL: -3% (overvalued)\n" +
              "  - Increase TSLA: +2% (oversold)\n" +
              "  - Maintain SPY: Current allocation\n\n" +
              "Consider executing rebalance within 1-2 trading days.";
    } else if (userQuery.includes("risk") || userQuery.includes("sentiment")) {
      reply = "🎯 **Market Risk Assessment:**\n\n" +
              "• Overall portfolio risk: **Medium**\n" +
              "• Market sentiment: Cautiously optimistic\n" +
              "• Key risks:\n" +
              "  - Geopolitical tensions\n" +
              "  - Fed policy uncertainty\n" +
              "  - Earnings season volatility\n\n" +
              "Recommend maintaining diversified positions and monitoring closely.";
    } else if (userQuery.includes("spy") || userQuery.includes("market")) {
      reply = "📈 **SPY/Market Analysis:**\n\n" +
              "• Golden cross detected (50-day MA > 200-day MA)\n" +
              "• Risk level: **Low-Medium**\n" +
              "• Recommendation: Hold current allocation\n" +
              "• Support level: $440, Resistance: $450\n\n" +
              "Market showing positive momentum with technical confirmation.";
    } else if (userQuery.includes("msft") || userQuery.includes("microsoft")) {
      reply = "💻 **MSFT Analysis:**\n\n" +
              "• Strong cloud growth momentum\n" +
              "• Risk level: **Low-Medium**\n" +
              "• Recommendation: Hold or slight increase\n" +
              "• AI integration driving growth\n\n" +
              "Solid fundamentals with strong competitive moat.";
    } else {
      // Generic response for other queries
      reply = "🤖 **FinSage Agent Response:**\n\n" +
              "I can help you analyze:\n" +
              "• Individual stock performance (AAPL, TSLA, MSFT, SPY)\n" +
              "• Portfolio risk assessment\n" +
              "• Rebalancing recommendations\n" +
              "• Market sentiment analysis\n\n" +
              "Try asking about specific stocks or portfolio metrics!";
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    return NextResponse.json({ 
      reply,
      timestamp: new Date().toISOString(),
      source: "finsage_agent",
      confidence: 0.85
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process chat request",
        reply: "I'm experiencing technical difficulties. Please try again in a moment."
      },
      { status: 500 }
    );
  }
}
