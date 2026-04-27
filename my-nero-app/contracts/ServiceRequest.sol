// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ServiceRequestSystem {
    enum RequestStatus { Open, Accepted, Submitted, Approved, Rejected }

    struct Request {
        string id;
        address requester;
        address provider;
        string title;
        string description;
        uint32 priority;
        string category;
        uint256 budget;
        RequestStatus status;
        string workNotes;
        string rejectionReason;
    }

    mapping(string => Request) public requests;
    string[] public requestIds;

    event RequestCreated(string id, address indexed requester, string title, uint256 budget);
    event RequestAccepted(string id, address indexed provider);
    event WorkSubmitted(string id, address indexed provider, string workNotes);
    event WorkApproved(string id, address indexed requester);
    event WorkRejected(string id, address indexed requester, string reason);

    modifier onlyRequester(string memory id) {
        require(msg.sender == requests[id].requester, "Not the requester");
        _;
    }

    modifier onlyProvider(string memory id) {
        require(msg.sender == requests[id].provider, "Not the provider");
        _;
    }

    function createRequest(
        string memory id,
        string memory title,
        string memory description,
        uint32 priority,
        string memory category,
        uint256 budget
    ) public {
        require(requests[id].requester == address(0), "Request ID already exists");
        
        requests[id] = Request({
            id: id,
            requester: msg.sender,
            provider: address(0),
            title: title,
            description: description,
            priority: priority,
            category: category,
            budget: budget,
            status: RequestStatus.Open,
            workNotes: "",
            rejectionReason: ""
        });
        
        requestIds.push(id);
        
        emit RequestCreated(id, msg.sender, title, budget);
    }

    function acceptRequest(string memory id) public {
        require(requests[id].requester != address(0), "Request not found");
        require(requests[id].status == RequestStatus.Open, "Request not open");
        require(requests[id].requester != msg.sender, "Requester cannot accept own request");

        requests[id].provider = msg.sender;
        requests[id].status = RequestStatus.Accepted;

        emit RequestAccepted(id, msg.sender);
    }

    function submitWork(string memory id, string memory workNotes) public onlyProvider(id) {
        require(requests[id].status == RequestStatus.Accepted || requests[id].status == RequestStatus.Rejected, "Invalid status to submit work");

        requests[id].workNotes = workNotes;
        requests[id].status = RequestStatus.Submitted;

        emit WorkSubmitted(id, msg.sender, workNotes);
    }

    function approveWork(string memory id) public onlyRequester(id) {
        require(requests[id].status == RequestStatus.Submitted, "Work not submitted yet");

        requests[id].status = RequestStatus.Approved;

        emit WorkApproved(id, msg.sender);
    }

    function rejectWork(string memory id, string memory reason) public onlyRequester(id) {
        require(requests[id].status == RequestStatus.Submitted, "Work not submitted yet");

        requests[id].rejectionReason = reason;
        requests[id].status = RequestStatus.Rejected;

        emit WorkRejected(id, msg.sender, reason);
    }

    function getRequest(string memory id) public view returns (Request memory) {
        require(requests[id].requester != address(0), "Request not found");
        return requests[id];
    }

    function listRequests() public view returns (Request[] memory) {
        Request[] memory allRequests = new Request[](requestIds.length);
        for (uint256 i = 0; i < requestIds.length; i++) {
            allRequests[i] = requests[requestIds[i]];
        }
        return allRequests;
    }
}
