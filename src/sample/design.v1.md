const UserController = new RacerEX_F.Route()
    .inject(userService, tokenValidation)
    .guards(isValidHuman)

UserController.CreateEndpoint()
    .config({
        type: 'REST',
        method: 'post',
        url: 'register'
    })
    .guards(
        GetUserBodyDTO
    )
    .middleware(
        loggerRegister
    )
    .main(async (rcf, injectedModule) => {
        const token = await rcf.getRequest<GetUserBodyDTO>().email
        // Some business logic
    })

UserController.CreateEndpoint()
    .config({
        type: 'ws',
        url: 'chat'
    })
    .guards( // walau guards nya ada tapi dia bakal diskip
        GetUserBodyDTO
    )
    .middleware( // ini bakal tetep kena
        loggerRegister
    )
    .main(async (rcf, injectedModule) => {
        const token = await rcf.getRequest<GetUserBodyDTO>().email
        // Some business logic
    })