import assert from "assert";
import { 
  TestHelpers,
  SubscriptionService_PlanCreated
} from "generated";
const { MockDb, SubscriptionService } = TestHelpers;

describe("SubscriptionService contract PlanCreated event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for SubscriptionService contract PlanCreated event
  const event = SubscriptionService.PlanCreated.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("SubscriptionService_PlanCreated is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await SubscriptionService.PlanCreated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualSubscriptionServicePlanCreated = mockDbUpdated.entities.SubscriptionService_PlanCreated.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedSubscriptionServicePlanCreated: SubscriptionService_PlanCreated = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      planId: event.params.planId,
      title: event.params.title,
      price: event.params.price,
      duration: event.params.duration,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualSubscriptionServicePlanCreated, expectedSubscriptionServicePlanCreated, "Actual SubscriptionServicePlanCreated should be the same as the expectedSubscriptionServicePlanCreated");
  });
});
