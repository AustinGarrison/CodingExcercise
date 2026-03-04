class Player implements IEffectTarget {
    
    private name: string;
    private password: string;
    public handManager: PlayerHandManager;
    effects: IEffect[] = [];

    public constructor(name: string, password: string) {
        this.name = name;
        this.password = password;
        this.handManager = new PlayerHandManager();
    }

    public attemptCard(card: Card) : boolean {
        for(const effect of this.effects) {
            if(!effect.cardAttempt(card)){
                return false;
            }
        }

        return true;
    }
    
    public getName(): string {
        return this.name;
    }

    public getPassword(): string {
        return this.password;    
    }

    public giveACard(card: Card){
        this.handManager.addCardToDeck(card);
    }   

    public playCardFromHand(handIndex: number): void {
        this.handManager.playCard(handIndex);
    }

    public addEffect(effect: IEffect): void{
        this.effects.push(effect);
    }

    public removeEffect(effect: IEffect): void{

    }

    public onRoundStart() : void{
        for(const effect of this.effects) {
            effect.onRoundStart();
        }
        
        this.effects = this.effects.filter(e => !e.effectExpired);
    }

    public onRoundEnd() : void {
        for(const effect of this.effects) {
            effect.onRoundEnd();
        }
    }
}

///Interfaces that can be applied to any actor in the game. Players, Cards, etc.

interface IEffect{
    effectExpired : boolean;
    
    cardAttempt(card: Card) : boolean;
    onRoundEnd() : void;
    onRoundStart() : void;
}

interface IEffectTarget {
    effects: IEffect[];
    addEffect(effect: IEffect) : void;
    removeEffect(effect: IEffect) : void;
}

///When applied to the player, listens for any opponent card that affects the player.
class PhishingProtection implements IEffect{
    effectExpired : boolean;
    usesLeft: number;

    constructor(){
        this.effectExpired = false;
        this.usesLeft = 4;
    }

    cardAttempt(card : Card) : boolean{
        if(card instanceof Phishing){
            return false;
        }
        else{
            return true;
        }
    }

    onRoundEnd() : void{
        this.usesLeft -= 1;

        if(this.usesLeft <= 0)
        {
            console.log("Phishing Protection has Ended");
            this.effectExpired = true;
        }
    }    
    
    onRoundStart() : void{ }
}

///Forces a scenerio where each player has 6 cards.
///Player one always attempts a phishing attack.
///Player two always skips turn, but applies firewall on the second turn.
class GameManager {
    players: Player[] = [];

    constructor() {
        this.players.push(new Player("Player One", "P@$$w0rD"));
        this.players.push(new Player("Player Two", "@dm1n"));
    }

    public givePlayersCards(): void {
        this.players[0].giveACard(new PhishPassword(this, this.players[0]));
        this.players[0].giveACard(new PhishPassword(this, this.players[0]));
        this.players[0].giveACard(new PhishPassword(this, this.players[0]));
        this.players[0].giveACard(new PhishPassword(this, this.players[0]));
        this.players[0].giveACard(new PhishPassword(this, this.players[0]));
        this.players[0].giveACard(new PhishPassword(this, this.players[0]));

        this.players[1].giveACard(new SkipTurn(this, this.players[1]));
        this.players[1].giveACard(new Firewall(this, this.players[1]));
        this.players[1].giveACard(new SkipTurn(this, this.players[1]));
        this.players[1].giveACard(new SkipTurn(this, this.players[1]));
        this.players[1].giveACard(new SkipTurn(this, this.players[1]));
        this.players[1].giveACard(new SkipTurn(this, this.players[1]));
    }

    public startTestGame(): void {
        console.log("-----------------Start of New Game-----------------");

        const count = this.players[0].handManager.cards.length - 1

        for (let i = 0; i <= count; i++) {
            console.log("-------Starting Round " + (i+1) + " -------")
            this.players[0].onRoundStart();
            this.players[1].onRoundStart();
            console.log("----Player 1 Turn----")
            this.players[0].playCardFromHand(i);
            console.log("----Player 2 Turn----")
            this.players[1].playCardFromHand(i);
            this.players[0].onRoundEnd();
            this.players[1].onRoundEnd();
        }

        console.log("-----------------End of Game-----------------");
    }
}

class PlayerHandManager {
    cards: Card[] = [];

    constructor( ) { }

    public addCardToDeck(card: Card){
        this.cards.push(card);
    }

    public playCard(index: number): void {

        this.cards[index].activateAbility();
    }

    public printAllCardAbilities(): void {

        for(const card of this.cards) {
            card.printAbility();
        }
    }
}

abstract class Card {

    gameManager: GameManager
    playerOwner: Player

    abstract printAbility(): void;
    abstract activateAbility(): void;

    constructor(gameManager: GameManager, playerOwner : Player) {
        this.gameManager = gameManager;
        this.playerOwner = playerOwner;
    }
}

class SkipTurn extends Card{

    printAbility(): void {
        console.log('Does Nothing');
    }

    activateAbility(): void{
        console.log('Skipping Turn');
    }
}

class Phishing extends Card {
    printAbility(): void {
        console.log('Attempts a retrieval of information from target');
    }

    activateAbility(): void {
    }
}

class PhishPassword extends Phishing {
    printAbility(): void {
        console.log('Attempts a retrieval of password from target');
    }

    activateAbility(): void {

        console.log("Attempting to phish Password from opponent");

        if(gameManager.players[1].attemptCard(this)){
            console.log("Success... Password is " + this.getOpponentPassword());
        }
        else{
            console.log("Phish Attempt Failed");
        }
    }

    getOpponentPassword(): string {

        return gameManager.players[1].getPassword();
    }
}

class Firewall extends Card {  
    phishingProtection : PhishingProtection

    constructor(gameManager: GameManager, playerOwner : Player) {
        super(gameManager, playerOwner);
        this.phishingProtection = new PhishingProtection();
    }

    printAbility(): void {
        console.log('Protects from phishing attacks for three turns');
    }

    activateAbility(): void {

        this.playerOwner.addEffect(this.phishingProtection);
        console.log('Enabled Firewall, Phishing Protection Enabled')
    }
}

const gameManager = new GameManager();
gameManager.givePlayersCards();

gameManager.startTestGame();
