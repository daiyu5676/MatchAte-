#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <random>
#include <emscripten/bind.h>

using namespace emscripten;

class Card {
public:
    int id;
    std::string symbol;
    bool isFlipped;
    bool isMatched;

    Card(int id, std::string symbol) : id(id), symbol(symbol), isFlipped(false), isMatched(false) {}
};

class GameEngine {
private:
    std::vector<Card> deck;
    int moves;
    int firstCardIndex;
    int secondCardIndex;
    int matches;

public:
    GameEngine() {
        moves = 0;
        matches = 0;
        firstCardIndex = -1;
        secondCardIndex = -1;
    }

    void initializeDeck() {
        deck.clear();
        moves = 0;
        matches = 0;
        firstCardIndex = -1;
        secondCardIndex = -1;

        std::vector<std::string> symbols = {
    "🍓","🍉","🍍","🍒","🍇","🥝","🍓","🍉","🍍","🍒","🍇","🥝"};
        std::random_device rd;
        std::default_random_engine rng(rd());
        std::shuffle(symbols.begin(), symbols.end(), rng);

        for (int i = 0; i < symbols.size(); i++) {
            deck.push_back(Card(i, symbols[i]));
        }
    }

    // --- GAME LOGIC ---
    
    // Returns true if a card was successfully flipped
    bool flipCard(int index) {
        if (index < 0 || index >= deck.size()) return false;
        if (deck[index].isMatched || deck[index].isFlipped) return false;
        
        // We only allow two cards to be flipped at a time
        if (firstCardIndex != -1 && secondCardIndex != -1) return false;

        deck[index].isFlipped = true;

        if (firstCardIndex == -1) {
            firstCardIndex = index;
        } else {
            secondCardIndex = index;
            moves++; // A move is counted when two cards are flipped
        }
        return true;
    }

    // Returns true if the two flipped cards match
    bool checkMatch() {
        if (firstCardIndex == -1 || secondCardIndex == -1) return false;

        bool isMatch = (deck[firstCardIndex].symbol == deck[secondCardIndex].symbol);
        
        if (isMatch) {
            deck[firstCardIndex].isMatched = true;
            deck[secondCardIndex].isMatched = true;
            matches++;
        } else {
            // Flip them back down
            deck[firstCardIndex].isFlipped = false;
            deck[secondCardIndex].isFlipped = false;
        }

        // Reset for the next turn
        firstCardIndex = -1;
        secondCardIndex = -1;

        return isMatch;
    }

    bool isGameWon() {
        return matches == (deck.size() / 2);
    }

    // --- GETTERS FOR JAVASCRIPT ---
    int getMoves() { return moves; }
    int getDeckSize() { return deck.size(); }
    std::string getCardSymbol(int index) { return deck[index].symbol; }
    bool isCardFlipped(int index) { return deck[index].isFlipped; }
    bool isCardMatched(int index) { return deck[index].isMatched; }
};

// --- EMBIND BRIDGE ---
EMSCRIPTEN_BINDINGS(my_module) {
    class_<GameEngine>("GameEngine")
        .constructor<>()
        .function("initializeDeck", &GameEngine::initializeDeck)
        .function("flipCard", &GameEngine::flipCard)
        .function("checkMatch", &GameEngine::checkMatch)
        .function("isGameWon", &GameEngine::isGameWon)
        .function("getMoves", &GameEngine::getMoves)
        .function("getDeckSize", &GameEngine::getDeckSize)
        .function("getCardSymbol", &GameEngine::getCardSymbol)
        .function("isCardFlipped", &GameEngine::isCardFlipped)
        .function("isCardMatched", &GameEngine::isCardMatched);
}