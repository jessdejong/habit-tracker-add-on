/* main.js */

function onHomepage(e) {
    Logger.log(e);

    // Get stored user hobbies
    let userProperties = PropertiesService.getUserProperties();
  
    let habitNames = [];
    let habitNumber = 1;
    while (true) {
        let name = userProperties.getProperty("habit" + habitNumber++);
        if (name == null) break;
        habitNames.push(name);
    }

    // Logger.log(habitNames);

    let cardSection = CardService.newCardSection();

    // Create habit buttons
    // let buttonSet = CardService.newButtonSet();
    for (let i = 0; i < habitNames.length; ++i) {
        // buttonSet.addButton(createToHabitButton(habitNames[i]));
        // cardSection.addWidget(createToHabitButton(habitNames[i]));
        cardSection.addWidget(createHabitAndRemoveHabitButtonSet(
                                        habitNames[i], "habit" + (i + 1)));
    }

    headerText = "You're currently tracking ";
    if (habitNames.length == 1)
        headerText += habitNames.length + " habit!";
    else
        headerText += habitNames.length + " habits!";

    // Build the homepage card
    let card = CardService.newCardBuilder()
        .setHeader(CardService.newCardHeader()
            .setTitle(headerText))
        .addSection(cardSection
            //.addWidget(buttonSet)
            .addWidget(CardService.newTextInput()
                .setFieldName("text_input_habit_key")
                .setTitle("ex. Yoga"))
            .addWidget(createAddHabitButton()));

    return card.build();
}

// Button to add a habit to the list of habits
function createAddHabitButton() {
    let action = CardService.newAction()
        .setFunctionName('onAddHabitPressed')
        .setParameters({});
    let button = CardService.newTextButton()
        .setText("Add Habit")
        .setOnClickAction(action);
    return button;
}

function createHabitAndRemoveHabitButtonSet(habitName, habitKey) {
    let habitButton = createToHabitButton(habitName, habitKey);
    let removeHabitButton = createRemoveHabitButton(habitName);
    
    return CardService.newButtonSet()
        .addButton(habitButton)
        .addButton(removeHabitButton);
}

function getColor(index) {
    //             Blue         Brown    Gray       Green       Orange
    let colors = ["#2952A3", "#8D6F47", "#5A6986", "#0D7813", "#BE6D00", 
    //    Pink      Purple      Red       Yellow
        "#B1365F", "#7A367A", "#A32929", "#AB8B00",];
    // return colors[Math.floor(Math.random() * colors.length)];
    return colors[(index - 1) % colors.length];
}

// Button for each of the Hobbies, i.e. Competitive Programming
function createToHabitButton(habitName, habitKey) {
    let habitNumber = habitKey.substring(5, habitKey.length);
    // Logger.log("habitNumber: " + habitNumber);
    let color = getColor(parseInt(habitNumber));
    // Logger.log(color);
    let action = CardService.newAction()
        .setFunctionName('createHabitDisplayCard')
        .setParameters({'habitName': habitName});
    let button = CardService.newTextButton()
        .setText(habitName)
        .setOnClickAction(action)
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor(color);
    return button;
}

// Remove Habit button
function createRemoveHabitButton(habitName) {
    let action = CardService.newAction()
        .setFunctionName('onRemoveHabitPressed')
        .setParameters({'habitName': habitName});
    let button = CardService.newImageButton()
        .setIconUrl("https://i.postimg.cc/VNXYbnNh/icons8-remove-96.png")
        .setOnClickAction(action);
    return button;
}
function logUserProperties() {
    let userProperties = PropertiesService.getUserProperties();
    let data = userProperties.getProperties();
    for (let key in data) {
          Logger.log('Key: %s, Value: %s', key, data[key]);
    }
}

function onRemoveHabitPressed(e) {
    let userProperties = PropertiesService.getUserProperties();

    // Get the index of the habit to be removed
    let habitName = e.parameters.habitName;
    let habitNumber = 1;
    let nameFound = false;
    while (true) {
        let name = userProperties.getProperty("habit" + habitNumber++);
        if (name == habitName) {
            habitNumber--;
            nameFound = true;
            break;
        }
    }

    if (nameFound) {
        // Remove that habit
        userProperties.deleteProperty("habit" + habitNumber);

        // Move up the habit numbers of the following proceeding habits
        while (true) {
            let name = userProperties.getProperty("habit" + ++habitNumber);

            if (name == null) break;

            userProperties.setProperty("habit" + (habitNumber - 1),
                        userProperties.getProperty("habit" + habitNumber));
            userProperties.deleteProperty("habit" + habitNumber);
        }
    }

    let card = onHomepage(e);

    let navigation = CardService.newNavigation()
        .updateCard(card);
    let actionResponse = CardService.newActionResponseBuilder()
        .setNavigation(navigation);
    return actionResponse.build();
}

// Handles when a habit is added. Homepage but displays the additional habit.
function onAddHabitPressed(e) {
    // Add the habit to the user properties
    let userProperties = PropertiesService.getUserProperties();
  
    // Get the habit number to add
    let habitNumber = 1;
    while (true) {
        let name = userProperties.getProperty("habit" + habitNumber++);
        if (name == null) break;
    }
    habitNumber--;

    if (e.formInput["text_input_habit_key"].length != 0) {
        userProperties.setProperty("habit" + habitNumber,
                                    e.formInput["text_input_habit_key"]);
    }
    
    logUserProperties();

    // Get the homepage card and display it
    let card = onHomepage(e);

    let navigation = CardService.newNavigation()
        .updateCard(card);
    let actionResponse = CardService.newActionResponseBuilder()
        .setNavigation(navigation);
    return actionResponse.build();
}

// e object contains habitName, the name of the habit to build
function createHabitDisplayCard(e) {
    let habitName = e.parameters.habitName;

    // Get the dates of "Competitive Programming" in the last two weeks
    var currentDate = new Date();
    var twoWeeksBefore = new Date(currentDate.getTime()
        - (14 * 24 * 60 * 60 * 1000));
    var events = CalendarApp.getDefaultCalendar().getEvents(twoWeeksBefore,
        currentDate, {search: 'Competitive Programming'});

    const dates = [];
    for (let i = 0; i < events.length; i++) {
        dates.push(events[i].getStartTime());
    }

    var listOfDatesParagraph = CardService.newTextParagraph()
        .setText(dates.join("\n"));

    // Build the habit display card
    let card = CardService.newCardBuilder()
        .setHeader(CardService.newCardHeader().setTitle(habitName))
        .addSection(CardService.newCardSection()
            .addWidget(listOfDatesParagraph)
            .addWidget(buildPreviousAndRootButtonSet()))
        .build();

    // Navigate to this habit display card
    let nav = CardService.newNavigation().pushCard(card);
    return CardService.newActionResponseBuilder()
        .setNavigation(nav)
        .build();
}

// var now = new Date();
// var fourHoursBefore = new Date(now.getTime() - (4 * 60 * 60 * 1000));
// var events = CalendarApp.getDefaultCalendar().getEvents(fourHoursBefore, now,
//     {search: 'Competitive Programming'});

// Logger.log('Number of events: ' + events.length);
// if (events.length > 0) {
//   Logger.log(events[0].getStartTime().toString());
// }

// const dates = [];
// for (let i = 0; i < events.length; i++) {
//   dates.push(events[i].getStartTime());
// }

// return createHomepageCard(dates);

// function createHomepageCard(dates) {
//   let datesConcatenated = "";
//   for (let i = 0; i < dates.length; ++i) {
//     datesConcatenated = datesConcatenated + " " + dates[i].toString();
//   }

//   var textParagraph = CardService.newTextParagraph()
//       .setText(datesConcatenated);
//   var section = CardService.newCardSection()
//       .addWidget(textParagraph);
//   var card = CardService.newCardBuilder()
//       .addSection(section);

//   return card.build();
// }


/**
*  Create a ButtonSet with two buttons: one that backtracks to the
*  last card and another that returns to the original (root) card.
*  @return {ButtonSet}
*/
function buildPreviousAndRootButtonSet() {
    let previousButton = CardService.newTextButton()
        .setText('Back')
        .setOnClickAction(CardService.newAction()
            .setFunctionName('gotoPreviousCard'));
    let toRootButton = CardService.newTextButton()
        .setText('To Root')
        .setOnClickAction(CardService.newAction()
            .setFunctionName('gotoRootCard'));

    // Return a new ButtonSet containing these two buttons.
    return CardService.newButtonSet()
        .addButton(previousButton)
        .addButton(toRootButton);
}

/**
*  Pop a card from the stack.
*  @return {ActionResponse}
*/
function gotoPreviousCard() {
    let nav = CardService.newNavigation().popCard();
    return CardService.newActionResponseBuilder()
        .setNavigation(nav)
        .build();
}

/**
*  Return to the initial add-on card.
*  @return {ActionResponse}
*/
function gotoRootCard() {
    let nav = CardService.newNavigation().popToRoot();
    return CardService.newActionResponseBuilder()
        .setNavigation(nav)
        .build();
}
